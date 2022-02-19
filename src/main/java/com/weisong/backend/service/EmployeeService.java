package com.weisong.backend.service;

import com.weisong.backend.entities.Employee;

import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-16-21:16
 */
public interface EmployeeService {

    List<Employee> getAllEmp();

    Long insertEmp(Employee employee);

    void deleteEmpById(Integer emp_id);
}
