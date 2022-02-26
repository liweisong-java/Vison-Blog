package com.weisong.backend.mapper;

import com.weisong.backend.entities.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-26-11:40
 */
@Mapper
@Repository
public interface ArticleMapper {

//    查询所有帖子
    @Select("select `UUID`,`name`,`email`,`gender`,`birth` from user")
    List<User> getAllArticle();

}
